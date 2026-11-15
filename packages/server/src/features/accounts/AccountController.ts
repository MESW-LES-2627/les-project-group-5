import type { FastifyInstance } from 'fastify';
import type { AccountService } from './AccountService';

interface SignUpBody {
  email: string;
  password: string;
}

interface ConfirmEmailBody {
  token: string;
}

/** The HTTP status for each result of a confirmation: 410 Gone says the link existed but is too old. */
const CONFIRM_EMAIL_STATUS = { confirmed: 200, expired: 410, invalid: 400 } as const;

/**
 * The HTTP routes for accounts. It only translates between HTTP and the service: the rules live in AccountService.
 * Passwords are never logged: Fastify's logger writes the method and address of each request, not its body.
 */
export class AccountController {
  constructor(private readonly accounts: AccountService) {}

  register(app: FastifyInstance): void {
    // POST /api/accounts: sign up (US-E1-01).
    app.post<{ Body: SignUpBody }>(
      '/api/accounts',
      {
        schema: {
          // The limits are much larger than the real rules (the service checks those and explains the error).
          // They only stop huge requests from reaching the slow password hash.
          body: {
            type: 'object',
            properties: {
              email: { type: 'string', maxLength: 1000 },
              password: { type: 'string', maxLength: 1000 },
            },
            required: ['email', 'password'],
            additionalProperties: false,
          },
        },
      },
      async (request, reply) => {
        const result = await this.accounts.signUp(request.body.email, request.body.password);
        if (result.outcome === 'rejected') return reply.code(400).send({ errors: result.errors });
        // The same answer whether or not the email already had an account (US-E1-01).
        return reply.code(202).send({ status: 'check-your-email' });
      },
    );

    // POST /api/email-confirmations: confirm an email with the token from the link (US-E1-02).
    // A POST, not a GET: the page only sends it when the person clicks the button, because some email
    // providers open links by themselves to scan them, which would confirm accounts without the person.
    app.post<{ Body: ConfirmEmailBody }>(
      '/api/email-confirmations',
      {
        schema: {
          body: {
            type: 'object',
            properties: { token: { type: 'string', maxLength: 200 } },
            required: ['token'],
            additionalProperties: false,
          },
        },
      },
      async (request, reply) => {
        const result = await this.accounts.confirmEmail(request.body.token);
        return reply.code(CONFIRM_EMAIL_STATUS[result]).send({ status: result });
      },
    );
  }
}
