/**
 * Quick-view ("Ver producto") hover icon — intentionally disabled storewide.
 * The trigger used to open a variation quick-view modal from the product
 * image hover; product cards now link straight to the product page instead.
 * Kept as a component (returning null) so ProductBox variants that render it
 * don't need changes, and it can be restored easily if ever wanted again.
 */
const QuickViewButton = () => null;

export default QuickViewButton;
