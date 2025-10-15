<?php
/**
 * Main Plugin Class.
 */
class LittleThingsBD_Preorders {
    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
            self::$instance->init();
        }
        return self::$instance;
    }

    private function init() {
        // Load dependencies and initialize hooks
        add_action('plugins_loaded', [$this, 'load_dependencies']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    private function load_dependencies() {
        // Load admin classes and AJAX handlers
    }

    public function enqueue_assets() {
        // Enqueue admin CSS and JS
    }
}

// Instantiate the plugin class
LittleThingsBD_Preorders::get_instance();
