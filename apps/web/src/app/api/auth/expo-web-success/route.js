import { getSessionUser } from "../../utils/session.js";

export async function GET(request) {
	const user = await getSessionUser(request);

	if (!user) {
		return new Response(
			`
			<html>
				<body>
					<script>
						window.parent.postMessage({ type: 'AUTH_ERROR', error: 'Unauthorized' }, '*');
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
					window.parent.postMessage(${JSON.stringify(message)}, '*');
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
