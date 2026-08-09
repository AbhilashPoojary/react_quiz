import React from "react";
import EventForm from "../../components/EventForm";

export default function AdminCreateEvent() {
  return (
    <div>
      <h1 className="app-strong-text mb-5 text-2xl font-bold">Create Event</h1>
      <EventForm />
    </div>
  );
}
