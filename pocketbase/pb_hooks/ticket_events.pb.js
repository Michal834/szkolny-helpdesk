/// <reference path="../pb_data/types.d.ts" />

// Historia zmian zgłoszeń zapisywana po stronie SERWERA.
// Dzięki temu nikt nie może podrobić wpisu (kolekcja ticket_events nie ma
// reguł create/update/delete dla API) - kto i kiedy zmienił status wiemy na pewno.

function addEvent(ticketId, actorId, fromStatus, toStatus, comment) {
  const col = $app.findCollectionByNameOrId("ticket_events");
  const ev = new Record(col);
  ev.set("ticket", ticketId);
  ev.set("actor", actorId);
  ev.set("from_status", fromStatus);
  ev.set("to_status", toStatus);
  ev.set("comment", comment);
  $app.save(ev);
}

// Nowe zgłoszenie -> wpis "utworzono"
onRecordCreateRequest((e) => {
  e.next();
  addEvent(
    e.record.id,
    e.auth ? e.auth.id : "",
    "",
    e.record.getString("status"),
    ""
  );
}, "tickets");

// Zmiana statusu lub komentarza -> wpis w historii
onRecordUpdateRequest((e) => {
  const prev = e.record.original();
  const fromStatus = prev.getString("status");
  const prevComment = prev.getString("comment");

  e.next();

  const toStatus = e.record.getString("status");
  const comment = e.record.getString("comment");
  if (fromStatus === toStatus && comment === prevComment) {
    return;
  }
  addEvent(
    e.record.id,
    e.auth ? e.auth.id : "",
    fromStatus,
    toStatus,
    comment !== prevComment ? comment : ""
  );
}, "tickets");
