# React Quiz App Flow

This document describes the current application flow for the React Quiz project. It is intended for development, testing, onboarding, and future feature work.

## 1. High-Level Architecture

The app is split into two projects:

- `client`: React + Vite frontend.
- `server`: Node.js + Express + MongoDB backend.

The frontend uses React Router for navigation and `apiClient` for API calls. The backend exposes authentication, quiz, challenge, event, notification, profile, and admin APIs.

The main backend route registration is in `server/index.js`:

- `/auth` and `/api/auth`: authentication routes.
- `/api/settings`: public app settings.
- `/api/admin`: admin-only routes.
- `/api/challenges`: challenge routes.
- `/api/`: quiz, result, profile, notification, and event participant routes.

## 2. Authentication Flow

### Register

Frontend:

- `AuthPage` renders `Signup`.
- User enters name, email, password, confirm password, and profile picture.
- Field validation runs on change and submit.
- Email availability is checked with debounce.
- Profile picture is selected and edited before upload.
- During register/profile image API work, a full-page loading overlay is shown.

Backend:

- `POST /auth/register`
- Creates user with validated name, email, password, and profile picture.
- Existing users are not affected by newer validation rules unless they update related fields.

### Login

Frontend:

- `AuthPage` renders `Signin`.
- Email and password are validated.
- During login, a full-page loading overlay is shown.
- Successful login redirects:
  - Admin: `/admin/dashboard`
  - Normal user: `/info`

Backend:

- `POST /auth/login`
- Verifies account status, password, and session handling.
- Supports single active session confirmation using `forceLogin`.

### Password Flows

Routes:

- `/forgot-password`
- `/reset-password/:token`
- `/change-password`

Backend:

- Forgot password sends email through the active `FORGOT_PASSWORD` email template.
- Reset password validates token.
- Change password supports expired-password flow through `verifyToken.allowExpiredPassword`.

## 3. Route Protection

Frontend route protection:

- `ProtectedRoute`: authenticated user routes.
- `AdminRoute`: admin routes.

Backend route protection:

- `verifyToken`: validates JWT and user status.
- `requireAdmin`: validates admin role.

Important security rule:

- Local storage is never trusted for authorization.
- Client-side role checks only control UI visibility.
- Protected data must be secured by backend middleware.

Example:

- Question bank is fetched from `GET /api/admin/question-bank`, protected by `verifyToken` and `requireAdmin`.
- The older public question-bank endpoint was removed.

## 4. Normal Quiz Flow

### Setup

Frontend route:

- `/info`

Components:

- `Home`
- `QuizDetails` for classic setup.
- `QuizSetupV2` for enhanced setup.

Setup version:

- Admin controls V1/V2 through dashboard setting.
- Public setting is loaded from `GET /api/settings/quiz-setup-version`.

User selects:

- Name
- Category
- Difficulty
- Question type
- Number of questions
- Timer settings
- Answer feedback setting

### Spin Challenge Setup

Frontend route:

- `/challenge/spin`

Availability:

- Linked from the V2 setup screen.

Behavior:

- User opens Spin Challenge from V2 setup.
- Three wheels randomize category, difficulty, and question count.
- User can stop each wheel individually or spin all.
- Result can be spun again.
- Start Quiz applies the selected settings and uses the normal quiz flow.
- The mode defaults to multiple choice, timed quiz, per-question timer, and normal quiz result handling.
- User can return to `/info` without starting.

### Question Fetch

Frontend:

- `requestQuestions` in `App.jsx`
- Calls `GET /api/questions`

Backend:

- `ResultController.getQuestions`
- Fetches questions from OpenTDB.

### Play Quiz

Frontend route:

- `/quiz`

Components:

- `QuizPage`
- `QuizComponent`
- `QuizOptions`

Behavior:

- Answers are shuffled client-side.
- Correct/wrong live indication is controlled by `showAnswerFeedback`.
- Per-question timer can show danger border animation near timeout.
- Timeout records unanswered answer.

### Save Result

Frontend:

- `finishQuiz` builds score, accuracy, timing, and answer analysis.
- Dispatches `insertScoreCall`.

Backend:

- `POST /api/score`
- Stores result with answer analysis.

### Result and Analysis

Routes:

- `/result`
- `/quiz-analysis/:attemptId`

Backend:

- `GET /api/score/:attemptId/analysis`

## 5. Challenge Flow

### Create Challenge

Entry points:

- `/challenge/create`
- Enhanced setup page challenge action.

Frontend:

- `ChallengeCreate`
- `QuizSetupV2`

Backend:

- `POST /api/challenges`

Challenge config includes:

- Category
- Difficulty
- Question count
- Question type
- Timer mode
- Total duration or time per question
- Answer feedback setting

Challenge questions are generated once and saved in the challenge document.

### Share and Accept

Routes:

- `/challenge/:code`

Backend:

- `GET /api/challenges/:code`
- `POST /api/challenges/:code/accept`

Rules:

- Creator is automatically a participant.
- One opponent can join.
- Challenge closes when both participants complete.

### Play Challenge

Route:

- `/challenge/:code/play`

Backend:

- `GET /api/challenges/:code/questions`
- `POST /api/challenges/:code/submit`

Security behavior:

- If answer feedback is disabled, correct answers are not sent to the browser during play.
- Scoring is still done on the backend using stored challenge questions.

### Challenge Results

Route:

- `/challenge/:code/results`

Backend:

- `GET /api/challenges/:code/results`

Analysis visibility:

- Detailed answer analysis is shown only when both players have completed, or when the challenge is closed.

### Challenge Deletion

Allowed when:

- Current user is challenge creator.
- No opponent has joined.
- No attempts exist.
- Challenge is still open.

Frontend:

- Profile challenge history shows delete for eligible challenges.

Backend:

- `DELETE /api/challenges/:code`

## 6. Event Flow

### Admin Creates Event

Routes:

- `/admin/events/create`
- `/admin/events/:id/edit`

Frontend:

- `EventForm`

Backend:

- `POST /api/admin/events`
- `PUT /api/admin/events/:id`

Admin enters:

- Event name
- Description
- Category
- Difficulty
- Question count
- Question type
- Timer mode
- Event date
- Start time
- Registration deadline
- Notify users option

During save/publish, a full-page loading overlay is shown.

### Publish Event

Backend:

- `POST /api/admin/events/:id/publish`

Behavior:

- Fetches questions.
- Stores questions with correct answers and answer order.
- Makes the event visible/available to users.

### Unpublish Event

Backend:

- `POST /api/admin/events/:id/unpublish`

Behavior:

- Moves event back to draft.
- Requires a reason.
- Removes registrations and notifies affected users.

### User Event Participation

Routes:

- `/events`
- `/events/:id/play`
- `/events/:id/result`

Backend:

- `GET /api/events/registered`
- `POST /api/events/:id/register`
- `GET /api/events/:id/play`
- `POST /api/events/:id/submit`
- `GET /api/events/:id/result`

Rules:

- Users register before playing.
- Event timing/status is enforced.
- Results are stored separately from normal quiz attempts.

## 7. Profile Flow

Route:

- `/profile`

Backend:

- `GET /api/profile`
- `PATCH /api/profile`

Profile page shows:

- User details
- Quiz stats
- Performance charts
- Recent quiz history
- Challenge history

Editable fields:

- Name
- Email
- Profile picture

Validation:

- Name: minimum 3, maximum 50.
- Email: format and uniqueness.
- Profile picture: supported file type and size.

Reset password:

- Available from profile.
- Existing password is mandatory.
- New password uses password strength validation.

## 8. Notifications Flow

### User Notifications

Route:

- `/notifications`

Backend:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

Notification sources:

- Event notifications.
- Admin-created notifications.

### Admin Notifications

Route:

- `/admin/notifications`

Behavior:

- Page primarily shows notification history.
- Create action opens a popup.
- Sending shows a full-page loading overlay.

Backend:

- `POST /api/admin/notifications`
- `GET /api/admin/notifications`

Targets:

- All active users.
- Specific users.
- Event registered users.

## 9. Admin Flow

Admin routes are under `/admin` and protected by `AdminRoute` in the frontend and `verifyToken + requireAdmin` in the backend.

### Admin Dashboard

Route:

- `/admin/dashboard`

Backend:

- `GET /api/admin/dashboard`
- `PATCH /api/admin/settings/quiz-setup-version`

Features:

- App statistics.
- Quiz and event metrics.
- Challenge metrics.
- Quiz setup version toggle.

### Question Bank

Route:

- `/admin/question-bank`

Backend:

- `GET /api/admin/question-bank`

Behavior:

- Fetches unique existing questions from normal quiz results, events, and challenges.
- Shows source information.
- Uses skeleton loading, filters, and pagination.
- Defaults missing question type to multiple choice.

### User Management

Route:

- `/admin/users`
- `/admin/users/:userId`

Backend:

- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/activate`
- `PATCH /api/admin/users/:id/deactivate`
- `DELETE /api/admin/users/:id`
- `PATCH /api/admin/users/:id/restore`
- Bulk activate/deactivate endpoints.

Current temporary frontend behavior:

- Soft-deleted accounts are filtered out before rendering the users grid.

Actions:

- Activate user.
- Deactivate user.
- Soft delete user.
- Restore user.
- Bulk activate/deactivate.
- Send notification to selected users.

Action submissions show loading overlays.

## 10. Email Template Flow

Routes:

- `/admin/email-templates`
- `/admin/email-templates/:templateId`
- `/admin/email-templates/:templateId/edit`

Backend:

- `GET /api/admin/email-templates`
- `GET /api/admin/email-templates/:id`
- `PUT /api/admin/email-templates/:id`
- `POST /api/admin/email-templates/:id/preview`
- `POST /api/admin/email-templates/:id/test`

Behavior:

- Templates are stored in MongoDB.
- Default forgot-password template is seeded by the backend.
- Template body supports allowed dynamic variables.
- Preview renders through backend template wrapping, matching outgoing email style.
- Edit page uses an email-style editor shell to align content editing with preview.
- Active/inactive status is controlled by a clear status section.

Important:

- Inactive templates are not used for outgoing emails.
- Forgot password depends on an active `FORGOT_PASSWORD` template.

## 11. Logging and Request Observability

Backend middleware:

- `requestLogger`

Logs include:

- Request method and endpoint.
- User ID and name when available.
- Request body when relevant.
- Response body.
- Errors.

Sensitive fields are masked.

Logging applies across the app, not only auth.

## 12. Loading and Feedback Patterns

Current frontend patterns:

- Skeleton loading for large page/table fetches.
- Full-page overlay for important submissions:
  - Login
  - Register
  - Event create/publish
  - Event publish/unpublish/delete
  - User activate/deactivate/soft-delete
  - Admin notification creation
  - Quiz setup version update
- Fixed error notifications that wrap long messages.
- Confirmation popups for destructive actions.

## 13. Security Notes

Backend authorization is the source of truth.

Key protections:

- Admin APIs use `verifyToken` and `requireAdmin`.
- Question bank is admin-only.
- Challenge deletion validates creator and no attempts.
- Challenge scoring is backend-owned.
- When challenge feedback is disabled, correct answers are not sent during play.
- User status checks block inactive/deleted users.
- Password reset uses tokenized flow.

Known temporary/frontend-only behavior:

- Admin users grid currently hides soft-deleted users in the frontend after fetching. This is intentionally temporary and should move to backend filtering if the behavior becomes permanent.

## 14. Primary Route Map

### Public/Auth Routes

- `/`
- `/login`
- `/forgot-password`
- `/reset-password/:token`

### Protected User Routes

- `/info`
- `/quiz`
- `/result`
- `/quiz-analysis/:attemptId`
- `/challenge/create`
- `/challenge/:code`
- `/challenge/:code/play`
- `/challenge/:code/results`
- `/dashboard`
- `/profile`
- `/notifications`
- `/events`
- `/events/:id/play`
- `/events/:id/result`

### Admin Routes

- `/admin/dashboard`
- `/admin/events`
- `/admin/events/create`
- `/admin/events/:id/edit`
- `/admin/question-bank`
- `/admin/users`
- `/admin/users/:userId`
- `/admin/notifications`
- `/admin/email-templates`
- `/admin/email-templates/:templateId`
- `/admin/email-templates/:templateId/edit`

## 15. Suggested Test Checklist

Authentication:

- Register with valid and invalid inputs.
- Login as normal user.
- Login as admin.
- Try inactive/deleted user login.
- Forgot password email preview/test.

Quiz:

- Start normal quiz with V1 and V2 setup.
- Test timed total quiz.
- Test per-question quiz and danger animation.
- Test answer feedback enabled/disabled.
- Submit quiz and open analysis.

Challenges:

- Create challenge.
- Delete challenge before opponent joins.
- Join challenge as second user.
- Play both sides.
- Verify results before and after both users complete.
- Verify disabled answer feedback does not expose correct answer during play.

Events:

- Create draft.
- Publish event.
- Register user.
- Play event.
- Submit result.
- Unpublish event with registered users.

Admin:

- Open dashboard.
- Switch quiz setup version.
- View question bank.
- Manage users.
- Create notification from popup.
- Edit email template content and status.
