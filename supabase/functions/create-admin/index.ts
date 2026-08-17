// Supabase Edge Runtime type definitions.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { withSupabase } from 'jsr:@supabase/server@^1';

const errorResponse = (error: string, status: number) =>
  Response.json({ error }, { status });

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') {
      return errorResponse('Method not allowed.', 405);
    }

    let payload: { email?: unknown; password?: unknown };
    try {
      payload = await request.json();
    } catch {
      return errorResponse('A valid request body is required.', 400);
    }

    const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Enter a valid email address.', 400);
    }

    if (password.length < 8) {
      return errorResponse('Password must be at least 8 characters.', 400);
    }

    const { data, error } = await context.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
        created_by: context.userClaims?.sub,
      },
    });

    if (error) {
      const duplicateUser = error.message.toLowerCase().includes('already') || error.status === 422;
      console.error('Admin user creation failed:', error.message);
      return errorResponse(
        duplicateUser ? 'An account with this email already exists.' : 'Failed to create administrator.',
        duplicateUser ? 409 : 400,
      );
    }

    return Response.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201 },
    );
  }),
};
