import type { PageLoad } from './$types';

export const load: PageLoad = async ({url}) => {
  const parachainQuery = url.searchParams.get('parachain') ?? '';
		const parachain = parseInt(parachainQuery);

    return {parachain};
}
