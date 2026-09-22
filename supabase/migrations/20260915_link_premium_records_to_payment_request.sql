-- Links successful_payments/teacher_premium back to the payment_request
-- row that caused them, so the admin payments page can precisely undo a
-- single confirmation (e.g. a mistaken click) without touching a
-- teacher's other premium purchases. No FK constraint — payment_request.id
-- may not match these tables' id type exactly, and none of the other
-- *_id columns in this schema declare one either.
alter table successful_payments
  add column if not exists payment_request_id integer;

alter table teacher_premium
  add column if not exists payment_request_id integer;
