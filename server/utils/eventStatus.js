const buildEventStartAt = (event) => {
  if (event.startAt) {
    return new Date(event.startAt);
  }

  const eventDate = new Date(event.eventDate);
  const [hours = "0", minutes = "0"] = String(event.startTime || "00:00").split(":");

  eventDate.setHours(Number(hours), Number(minutes), 0, 0);
  return eventDate;
};

const buildEventEndAt = (event) => {
  if (event.endAt) {
    return new Date(event.endAt);
  }

  const startAt = buildEventStartAt(event);
  return new Date(startAt.getTime() + Number(event.duration || 0) * 60000);
};

const buildEventSchedule = ({ eventDate, startTime, duration }) => {
  const startAt = buildEventStartAt({ eventDate, startTime });
  const endAt = new Date(startAt.getTime() + Number(duration || 0) * 60000);

  return { startAt, endAt };
};

const getEffectiveEventStatus = (event, now = new Date()) => {
  if (event.status === "DRAFT" || event.status === "CANCELLED") {
    return event.status;
  }

  const startAt = buildEventStartAt(event);
  const endAt = buildEventEndAt(event);

  if (now < startAt) {
    return "UPCOMING";
  }

  if (now >= startAt && now <= endAt) {
    return "LIVE";
  }

  return "COMPLETED";
};

const withEffectiveEventStatus = (event) => {
  const eventObject = typeof event.toObject === "function" ? event.toObject() : event;

  return {
    ...eventObject,
    effectiveStatus: getEffectiveEventStatus(eventObject),
  };
};

module.exports = {
  buildEventEndAt,
  buildEventSchedule,
  buildEventStartAt,
  getEffectiveEventStatus,
  withEffectiveEventStatus,
};
