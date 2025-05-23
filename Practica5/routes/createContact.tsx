import { Handlers, FreshContext } from "$fresh/server.ts";

export const handler: Handlers<unknown> = {
  POST: async (req: Request, _ctx: FreshContext<unknown, unknown>) => {
    const formData = await req.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");

    const newContact = { name, email, phone };

    const res = await fetch("https://back-a-p4.onrender.com/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newContact),
    });

    if (!res.ok) {
      return new Response("Error al crear contacto", { status: 500 });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: "/contact" },
    });
  },
};

const Page = () => {
  return (
    <div className="center">
      <h1>Crear Contacto</h1>
      <form method="POST">
        <input type="text" name="name" placeholder="Nombre" required />
        <input type="email" name="email" placeholder="Email" required />
        <input type="text" name="phone" placeholder="Teléfono" required />
        <button type="submit">Crear Contacto</button>
      </form>
    </div>
  );
};
export default Page;
