/// <reference path="../pb_data/types.d.ts" />

// Migracja tworzy całą strukturę bazy i REGUŁY API (to one chronią dane,
// a nie interfejs). Uruchamia się automatycznie przy starcie PocketBase.
//
// Lista sal musi być zgodna z src/lib/constants.ts (ROOMS).

migrate(
  (app) => {
    const ROOMS = [
      "Sala 101",
      "Sala 102",
      "Sala 103",
      "Sala 104",
      "Sala 105",
      "Pracownia informatyczna 1",
      "Pracownia informatyczna 2",
      "Sala gimnastyczna",
      "Biblioteka",
      "Świetlica",
      "Pokój nauczycielski",
      "Aula",
    ];
    const STATUSES = ["nowe", "w_realizacji", "zamkniete"];

    const isTech = '@request.auth.role = "technician"';

    // ---------------------------------------------------------------
    // 1) users: pole "role" + reguły
    // ---------------------------------------------------------------
    const users = app.findCollectionByNameOrId("users");

    users.fields.add(
      new SelectField({
        name: "role",
        values: ["user", "technician"],
        maxSelect: 1,
        required: false, // puste = zwykły użytkownik
      })
    );

    // Rejestracja otwarta, ale nie można sobie nadać roli.
    users.createRule = "@request.body.role:isset = false";
    // Użytkownik widzi tylko siebie; technik widzi autorów zgłoszeń (expand).
    users.listRule = `id = @request.auth.id || ${isTech}`;
    users.viewRule = `id = @request.auth.id || ${isTech}`;
    // Edycja własnego konta, ale BEZ zmiany roli. Rolę zmienia tylko superuser.
    users.updateRule = "id = @request.auth.id && @request.body.role:isset = false";
    users.deleteRule = null; // tylko superuser

    app.save(users);

    // ---------------------------------------------------------------
    // 2) tickets
    // ---------------------------------------------------------------
    const tickets = new Collection({
      type: "base",
      name: "tickets",
      // Użytkownik: tylko swoje. Technik: wszystkie.
      listRule: `author = @request.auth.id || ${isTech}`,
      viewRule: `author = @request.auth.id || ${isTech}`,
      // Tworzyć może zalogowany, wyłącznie jako on sam, ze statusem "nowe",
      // bez komentarza technika.
      createRule:
        '@request.auth.id != "" && @request.body.author = @request.auth.id && @request.body.status = "nowe" && @request.body.comment:isset = false',
      // Zmieniać może tylko technik i tylko status + komentarz.
      updateRule:
        `${isTech}` +
        " && @request.body.title:isset = false" +
        " && @request.body.description:isset = false" +
        " && @request.body.room:isset = false" +
        " && @request.body.category:isset = false" +
        " && @request.body.priority:isset = false" +
        " && @request.body.author:isset = false" +
        " && @request.body.photo:isset = false",
      deleteRule: null, // tylko superuser
      fields: [
        { type: "text", name: "title", required: true, min: 3, max: 120 },
        { type: "text", name: "description", required: true, min: 10, max: 2000 },
        { type: "select", name: "room", required: true, maxSelect: 1, values: ROOMS },
        {
          type: "select",
          name: "category",
          required: true,
          maxSelect: 1,
          values: ["sprzet_komputerowy", "multimedia", "instalacje", "inne"],
        },
        {
          type: "select",
          name: "priority",
          required: true,
          maxSelect: 1,
          values: ["niski", "sredni", "wysoki"],
        },
        { type: "select", name: "status", required: true, maxSelect: 1, values: STATUSES },
        { type: "text", name: "comment", required: false, max: 1000 },
        {
          type: "relation",
          name: "author",
          required: true,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        {
          // jeden plik, maks. 5 MB, tylko obrazy
          type: "file",
          name: "photo",
          required: false,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          thumbs: ["400x300"],
        },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
        { type: "autodate", name: "updated", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE INDEX idx_tickets_author ON tickets (author)",
        "CREATE INDEX idx_tickets_status ON tickets (status)",
      ],
    });
    app.save(tickets);

    // ---------------------------------------------------------------
    // 3) ticket_events (historia zmian)
    //    Zapisywane WYŁĄCZNIE przez hook serwerowy (pb_hooks/ticket_events.pb.js),
    //    więc create/update/delete przez API są zablokowane (null).
    // ---------------------------------------------------------------
    const events = new Collection({
      type: "base",
      name: "ticket_events",
      listRule: `ticket.author = @request.auth.id || ${isTech}`,
      viewRule: `ticket.author = @request.auth.id || ${isTech}`,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          type: "relation",
          name: "ticket",
          required: true,
          collectionId: tickets.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          type: "relation",
          name: "actor",
          required: false,
          collectionId: users.id,
          maxSelect: 1,
          cascadeDelete: false,
        },
        { type: "select", name: "from_status", required: false, maxSelect: 1, values: STATUSES },
        { type: "select", name: "to_status", required: false, maxSelect: 1, values: STATUSES },
        { type: "text", name: "comment", required: false, max: 1000 },
        { type: "autodate", name: "created", onCreate: true, onUpdate: false },
      ],
      indexes: ["CREATE INDEX idx_events_ticket ON ticket_events (ticket)"],
    });
    app.save(events);
  },
  (app) => {
    // rollback
    for (const name of ["ticket_events", "tickets"]) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    }
    try {
      const users = app.findCollectionByNameOrId("users");
      users.fields.removeByName("role");
      app.save(users);
    } catch (_) {}
  }
);
