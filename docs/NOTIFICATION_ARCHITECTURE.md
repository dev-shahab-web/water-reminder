# Notification Architecture

## Purpose

Notifications are platform capabilities exposed through a stable app service layer.

## Rules

- Feature modules do not call Expo Notifications directly.
- Permission requests are centralized.
- Scheduling and cancellation use typed platform APIs.
- Notification payloads must be versioned or structured enough for safe deep linking.
- Notification handlers should delegate to navigation or feature services without embedding business logic.

## Responsibilities

Platform notifications own:

- Permission status
- Permission prompts
- Scheduling
- Cancellation
- Notification listeners
- Payload normalization

Modules own:

- Deciding when a domain event requires notification scheduling
- Providing schedule data through repository/service APIs

## Future Considerations

Notification architecture must support reminders, medicine schedules, habits, and other recurring workflows.
