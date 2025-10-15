<?php
/**
 * Plugin Name: LittleThings Pre-Order Manager
 * Plugin URI: https://littlethingsbd.com
 * Description: Manage manual pre-orders for out-of-stock products with WooCommerce integration
 * Version: 1.0.0
 * Author: imIstiak
 * Author URI: https://github.com/imIstiak
 * Text Domain: lt-preorders
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 8.1
 * WC requires at least: 7.0
 * WC tested up to: 8.5
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package LittleThings\PreOrders
 */

namespace LittleThings\PreOrders;

defined( 'ABSPATH' ) || exit;

// Define plugin constants.
define( 'LT_PREORDERS_VERSION', '1.0.0' );
define( 'LT_PREORDERS_FILE', __FILE__ );
define( 'LT_PREORDERS_PATH', plugin_dir_path( __FILE__ ) );
define( 'LT_PREORDERS_URL', plugin_dir_url( __FILE__ ) );
define( 'LT_PREORDERS_BASENAME', plugin_basename( __FILE__ ) );

// Require main plugin class.
require_once LT_PREORDERS_PATH . 'includes/class-plugin.php';

/**
 * Initialize the plugin.
 */
function lt_preorders_init() {
	// Check WooCommerce dependency.
	if ( ! class_exists( 'WooCommerce' ) ) {
		add_action( 'admin_notices', __NAMESPACE__ . '\lt_preorders_wc_missing_notice' );
		return;
	}

	// Load text domain.
	load_plugin_textdomain( 'lt-preorders', false, dirname( LT_PREORDERS_BASENAME ) . '/languages' );

	// Initialize main plugin class.
	Plugin::instance();
}
add_action( 'plugins_loaded', __NAMESPACE__ . '\lt_preorders_init', 20 );

/**
 * WooCommerce missing notice.
 */
function lt_preorders_wc_missing_notice() {
	?>
	<div class="notice notice-error">
		<p>
			<?php
			echo wp_kses_post(
				sprintf(
					/* translators: %s: WooCommerce plugin name */
					__( '<strong>LittleThings Pre-Order Manager</strong> requires %s to be installed and activated.', 'lt-preorders' ),
					'<a href="https://wordpress.org/plugins/woocommerce/" target="_blank">WooCommerce</a>'
				)
			);
			?>
		</p>
	</div>
	<?php
}

/**
 * Activation hook.
 */
function lt_preorders_activate() {
	// Check requirements.
	if ( version_compare( PHP_VERSION, '8.1', '<' ) ) {
		deactivate_plugins( LT_PREORDERS_BASENAME );
		wp_die( esc_html__( 'This plugin requires PHP 8.1 or higher.', 'lt-preorders' ) );
	}

	if ( ! class_exists( 'WooCommerce' ) ) {
		deactivate_plugins( LT_PREORDERS_BASENAME );
		wp_die( esc_html__( 'This plugin requires WooCommerce to be installed and activated.', 'lt-preorders' ) );
	}

	// Set default settings.
	if ( ! get_option( 'lt_preorders_settings' ) ) {
		update_option(
			'lt_preorders_settings',
			array(
				'default_status'           => 'on-hold',
				'delivery_inside_label'    => __( 'Inside Dhaka', 'lt-preorders' ),
				'delivery_outside_label'   => __( 'Outside Dhaka', 'lt-preorders' ),
				'enable_advance_paid'      => '1',
				'enable_pathao'            => '1',
				'visible_columns'          => array( 'customer', 'date', 'status', 'products', 'delivery_charge', 'total', 'due', 'delivery_zone' ),
				'shipping_mapping'         => array(),
			)
		);
	}

	// Flush rewrite rules.
	flush_rewrite_rules();
}
register_activation_hook( __FILE__, __NAMESPACE__ . '\lt_preorders_activate' );

/**
 * Deactivation hook.
 */
function lt_preorders_deactivate() {
	flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, __NAMESPACE__ . '\lt_preorders_deactivate' );
