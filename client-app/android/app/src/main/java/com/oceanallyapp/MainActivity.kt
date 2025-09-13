package com.oceanallyapp

import android.os.Bundle;
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "OceanAllyApp"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use a util class [ ] which allows you to easily enable Fabric and Concurrent React
     * (aka React 18) with two boolean flags.
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, false)

    /**
     * This is required for react-native-gesture-handler to work correctly.
     */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(null)
    }
}