import { FreshContext, Handlers, PageProps } from "$fresh/server.ts";

type Contact = {
  name: string;
  phone: string;
  chatId: string;
};

type Message = {
  isContactMessage: boolean;
  content: string;
  chatId: string;
};

type Data = {
  contacts: Contact[];
  messages: Message[];
  selectedChatId: string | null;
};

export const handler: Handlers<Data> = {
  GET: async (req: Request, ctx: FreshContext) => {
    try {
      const url = new URL(req.url);
      const chatId = url.searchParams.get("chatId");

      const [contactsRes, messagesRes] = await Promise.all([
        fetch("https://back-a-p4.onrender.com/contacts"),
        chatId
          ? fetch(`https://back-a-p4.onrender.com/messages/chat/${chatId}`)
          : Promise.resolve({ ok: true, json: () => [] }),
      ]);

      const contactsData = await contactsRes.json();
      const messagesData = chatId && messagesRes.ok
        ? await messagesRes.json()
        : [];

      return ctx.render({
        contacts: contactsData.data || [],
        messages: messagesData.data || [],
        selectedChatId: chatId,
      });
    } catch (err) {
      console.error("Error cargando datos:", err);
      return ctx.render({
        contacts: [],
        messages: [],
        selectedChatId: null,
      });
    }
  },
  POST: async (req: Request, _ctx: FreshContext) => {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return new Response("chatId requerido", { status: 400 });
    }

    const formData = await req.formData();
    const message = formData.get("message");

    if (typeof message !== "string" || !message.trim()) {
      return new Response("Mensaje vacío", { status: 400 });
    }

    const payload = { content: message, chatId, isContactMessage: false }; // el isContactMessage es para probar cuando el mensaje es eviado por otro

    const res = await fetch("https://back-a-p4.onrender.com/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return new Response("Error al enviar mensaje", { status: 500 });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: `/contact?chatId=${chatId}` },
    });
  },
};

export default function ContactPage({ data }: PageProps<Data>) {
  console.log("Data:", data);
  return (
    <div class="container">
      <div class="contact-list">
        <a href="/createContact" class="buttonCreate">
          Crear Contacto
        </a>
        <ul>
          {data.contacts.map((contact) => (
            <li key={contact.chatId} class="buttonContact">
              <a href={`/contact?chatId=${contact.chatId}`}>
                <strong>{contact.name}</strong>
                <br />
                <span>{contact.phone}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div class="message-list">
        <h2>Mensajes</h2>
        {data.selectedChatId
          ? (
            data.messages.length > 0
              ? (
                <>
                  {data.messages.map((msg, index) => (
                    <div
                      key={index}
                      class={`message ${
                        msg.isContactMessage ? "received" : "sent"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </>
              )
              : <p>No hay mensajes para este contacto.</p>
          )
          : <p>Selecciona un contacto para ver sus mensajes.</p>}
      </div>

      {data.selectedChatId && (
        <div class="sendMessage">
          <form method="POST" action={`/contact?chatId=${data.selectedChatId}`}>
            <input
              type="text"
              name="message"
              placeholder="Escribe un mensaje..."
              required
            />
            <button type="submit">Enviar</button>
          </form>
        </div>
      )}
    </div>
  );
}
