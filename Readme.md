## Description of the Project:

This project is a full-stack Study Planner web application built with a Flask backend and React frontend. It allows users to register and log in, create detailed study plans with customizable tasks, and track their academic progress. All core functionality is protected behind authentication and synced with a MongoDB database. Users can add, edit, delete, and toggle task completion, as well as delete their accounts. It provides a streamlined way for students to organize their study routines while securely managing their data.

---

## Registration and Login:

There needs to be some sort of user control: logging in, registering, logging out.

Certain features should only be available to logged-in users.

**Describe what functionality will only be available to logged-in users:**

- Accessing the study dashboard
- Creating, updating, and deleting study plans
- Adding or removing tasks within plans
- Marking tasks as complete/incomplete
- Deleting a user account
- All `/study` routes and `/auth/logout` are protected with `@login_required`

---

## Forms:

At least 4 forms (can include registration and login forms)

**List and describe at least 4 forms:**

1. **Registration Form** — Collects username, email, and password to create a new user account.
2. **Login Form** — Authenticates users with email and password credentials.
3. **Study Plan Form** — Lets users create new study plans with title, subject, deadline, and dynamic task list.
4. **Task Addition Form** — Allows users to append new tasks to an existing study plan.
5. **Delete Account Confirmation** — A 2-step confirmation modal for irreversible account deletion.

---

## Blueprints:

Must have at least 2 blueprints.

Each blueprint should have at least 2 visible and accessible routes.

**List and describe your routes/blueprints (don’t need to list all routes/blueprints you may have—just enough for the requirement):**

### `auth_bp` (url_prefix: `/auth`)

- `POST /register` — Registers a new user
- `POST /login` — Logs in an existing user
- `POST /logout` — Logs the user out and clears the session
- `POST /delete-account` — Deletes the user and all their study data
- `GET /check` — Returns current login status for session sync

### `study_bp` (url_prefix: `/study`)

- `POST /create` — Creates a new study plan
- `GET /all` — Retrieves all study plans for the logged-in user
- `POST /<plan_id>/add-task` — Appends a new task to a plan
- `POST /<plan_id>/toggle-task` — Toggles task completion
- `POST /<plan_id>/delete-task` — Deletes a specific task from a plan
- `DELETE /<plan_id>` — Deletes a study plan

---

## Database:

Must use MongoDB

**Describe what will be stored/retrieved from MongoDB:**

- `users` collection: stores usernames, emails, and hashed passwords
- `study_plans` collection:
  - `user_id` — ID reference to the owner of the plan
  - `title`, `subject`, `deadline`
  - `tasks[]` — Array of objects: `{ name: string, done: boolean }`
- Task completion and deletion are updated via `$set` and `$pull` Mongo operators
- Account deletion removes all documents associated with the user

---

## Describe what Python package or API you will use and how it will affect the user experience:

This project integrates `Flask-Mail` as a third-party Python package to enhance the user experience by sending email notifications. Specifically:

- When a user registers, they receive a welcome email.
- When a user deletes their account, they receive a confirmation email.

These notifications improve transparency and professionalism while giving users assurance that their actions have been acknowledged and processed. `Flask-Mail` is configured using Gmail SMTP and securely managed via environment variables for `MAIL_USERNAME` and `MAIL_PASSWORD`.

