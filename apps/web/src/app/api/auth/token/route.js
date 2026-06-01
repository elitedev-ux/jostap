import { getSessionUser } from "../../utils/session.js";

export async function GET(request) {
	const user = await getSessionUser(request);

	if (!user) {
		return new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json',
			},
		});
	}

	return new Response(
		JSON.stringify({
			jwt: null,
			user: {
				id: user.id,
				email: user.email,
				name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
			},
		}),
		{
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
}
