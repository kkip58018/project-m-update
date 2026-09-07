/**
 * Reset the React Query cache after a backend refresh/write.
 *
 * The backend clears its own cache in the same request; this function makes
 * sure the client never keeps serving the old snapshot:
 *   - invalidateQueries() marks every query stale and immediately refetches
 *     the queries that are currently visible (active observers).
 *   - removeQueries({ type: 'inactive' }) drops cached payloads for pages that
 *     aren't open, so when the user navigates there it always fetches fresh
 *     data instead of re-hydrating the previous snapshot.
 */
export function resetQueryCaches(queryClient) {
  queryClient.invalidateQueries();
  queryClient.removeQueries({ type: 'inactive' });
}
