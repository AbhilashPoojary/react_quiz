const express = require("express");
const {
  dashboard,
  listUsers,
  getAdminUser,
  activateUser,
  deactivateUser,
  softDeleteUser,
  restoreUser,
  bulkActivateUsers,
  bulkDeactivateUsers,
  createAdminNotification,
  listAdminNotifications,
  listEmailTemplates,
  getEmailTemplate,
  updateEmailTemplate,
  previewEmailTemplate,
  sendEmailTemplateTest,
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  unpublishEvent,
} = require("../controllers/Admin");
const { updateQuizSetupVersion } = require("../controllers/Settings");
const verifyToken = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

const AdminRouter = express.Router();

AdminRouter.use(verifyToken, requireAdmin);

AdminRouter.get("/dashboard", dashboard);
AdminRouter.patch("/settings/quiz-setup-version", updateQuizSetupVersion);
AdminRouter.get("/users", listUsers);
AdminRouter.post("/users/bulk/activate", bulkActivateUsers);
AdminRouter.post("/users/bulk/deactivate", bulkDeactivateUsers);
AdminRouter.get("/users/:id", getAdminUser);
AdminRouter.patch("/users/:id/activate", activateUser);
AdminRouter.patch("/users/:id/deactivate", deactivateUser);
AdminRouter.delete("/users/:id", softDeleteUser);
AdminRouter.patch("/users/:id/restore", restoreUser);
AdminRouter.post("/notifications", createAdminNotification);
AdminRouter.get("/notifications", listAdminNotifications);
AdminRouter.get("/email-templates", listEmailTemplates);
AdminRouter.get("/email-templates/:id", getEmailTemplate);
AdminRouter.put("/email-templates/:id", updateEmailTemplate);
AdminRouter.post("/email-templates/:id/preview", previewEmailTemplate);
AdminRouter.post("/email-templates/:id/test", sendEmailTemplateTest);
AdminRouter.get("/events", listEvents);
AdminRouter.post("/events", createEvent);
AdminRouter.get("/events/:id", getEvent);
AdminRouter.put("/events/:id", updateEvent);
AdminRouter.delete("/events/:id", deleteEvent);
AdminRouter.post("/events/:id/publish", publishEvent);
AdminRouter.post("/events/:id/unpublish", unpublishEvent);

module.exports = AdminRouter;
