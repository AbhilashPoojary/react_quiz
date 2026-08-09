import React from "react";
import { useParams } from "react-router-dom";
import EventForm from "../../components/EventForm";

export default function AdminEditEvent() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="app-strong-text mb-5 text-2xl font-bold">Edit Event</h1>
      <EventForm eventId={id} />
    </div>
  );
}
