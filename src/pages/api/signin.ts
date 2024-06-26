import type { APIRoute } from "astro";
import I18n from "../../i18n";
import { SignJWT } from "jose";
import { nanoid } from "nanoid";
import { TOKEN } from "../../constants";
const secret = new TextEncoder().encode(import.meta.env.JWT_SECRET_KEY);

export const POST: APIRoute = async (context) => {
  const locale = context.request.headers.get("accept-language");
  const i18n = new I18n(locale);
  try {
    const formData = await context.request.formData();
    const response = await fetch(`http://localhost:8012/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.locale,
      },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    const user = await response.json();
    if (user.id) {
       const token = await new SignJWT({})
         .setProtectedHeader({ alg: "HS256" })
         .setJti(nanoid())
         .setIssuedAt()
         .setIssuer("domain-name-here")
         .setSubject(user.id)
         .setExpirationTime("500mins")
         .sign(secret); // or get token form the external

       // set cookies
       // httpOnly cookie can only be accessed via the server. It's not accessible by javascript from the client.
       context.cookies.set(TOKEN, token, {
         httpOnly: true, 
         path: "/",
         maxAge: 60 * 500, // in seconds
       });
    }
    return new Response(
      JSON.stringify({
        user: user,
        message: i18n.t("validations.signin-success"),
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        message: i18n.t("validations.signin-error"),
      }),
      { status: 400 }
    );
  }
};
