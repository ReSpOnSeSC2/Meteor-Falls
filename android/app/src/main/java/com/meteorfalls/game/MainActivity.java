package com.meteorfalls.game;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

/**
 * METEOR FALLS shell (S8 / Bible Prompt 41): landscape lock lives in the
 * manifest; this activity owns keep-awake, immersive fullscreen, and the
 * display-cutout mode that feeds env(safe-area-inset-*) to the touch overlay
 * (src/engine/native.ts reads them and keeps the d-pad out of the notch).
 */
public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // keep-awake during play: rolling HP odometers don't pause for timeouts
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    // draw edge-to-edge under the camera cutout so the WebView sees real
    // safe-area insets instead of a system letterbox
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
      getWindow().getAttributes().layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
    }
    applyImmersiveMode();
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    // bars re-hide after dialogs, calls, and app switches
    if (hasFocus) applyImmersiveMode();
  }

  private void applyImmersiveMode() {
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    WindowInsetsControllerCompat controller =
        WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
    controller.hide(WindowInsetsCompat.Type.systemBars());
    controller.setSystemBarsBehavior(
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
  }
}
