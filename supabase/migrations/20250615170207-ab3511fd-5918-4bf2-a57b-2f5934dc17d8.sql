
-- Ensure the vibe interaction trigger is properly set up and working
-- Let's recreate it to make sure it's functioning correctly

DROP TRIGGER IF EXISTS trigger_notify_vibe_interaction ON public.posts_interactions;

CREATE TRIGGER trigger_notify_vibe_interaction
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vibe_interaction();

-- Also ensure the trigger is firing before the generic comment trigger
-- by recreating the generic triggers with different names so vibe trigger fires first

DROP TRIGGER IF EXISTS trigger_notify_new_comment ON public.posts_interactions;
DROP TRIGGER IF EXISTS trigger_notify_new_like ON public.posts_interactions;

-- Recreate the generic triggers with names that come after "vibe" alphabetically
CREATE TRIGGER trigger_z_notify_new_comment
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_comment();

CREATE TRIGGER trigger_z_notify_new_like
  AFTER INSERT ON public.posts_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_like();
