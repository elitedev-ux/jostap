import { getSessionUser } from "../../utils/session.js";

export async function GET(request) {
	const user = await getSessionUser(request);
	const targetOrigin = new URL(request.url).origin;

	if (!user) {
		return new Response(
			`
			<html>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, ${JSON.stringify(targetOrigin)});
					</script>
				</body>
			</html>
			`,
			{
				status: 401,
				headers: {
					'Content-Type': 'text/html',
				},
			}
		);
	}

	const message = {
		type: 'AUTH_SUCCESS',
		jwt: null,
		user: {
			id: user.id,
			email: user.email,
			name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
		},
	};

	return new Response(
		`
		<html>
			<body>
				<script>
					window.parent.postMessage(${JSON.stringify(message)}, ${JSON.stringify(targetOrigin)});
				</script>
			</body>
		</html>
		`,
		{
			headers: {
				'Content-Type': 'text/html',
			},
		}
	);
}
