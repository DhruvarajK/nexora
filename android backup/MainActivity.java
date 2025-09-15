package com.Nexora.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import com.getcapacitor.BridgeActivity;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import android.location.Location;

public class MainActivity extends BridgeActivity {

    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1;
    private FusedLocationProviderClient fusedLocationClient;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        requestLocationPermission();
    }

    @Override
    public void onBackPressed() {
        WebView webView = getBridge().getWebView();
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private void requestLocationPermission() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, LOCATION_PERMISSION_REQUEST_CODE);
        } else {
            getAndInjectLocation();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d("MainActivity", "Location permission granted.");
                getAndInjectLocation();
            } else {
                Log.w("MainActivity", "Location permission denied.");
                injectGeolocationError("Location permission denied by user.");
            }
        }
    }

    // This method is now much simpler
    private void getAndInjectLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            Log.w("MainActivity", "Attempted to get location without permission.");
            requestLocationPermission();
            return;
        }

        fusedLocationClient.getLastLocation()
            .addOnSuccessListener(this, location -> {
                if (location != null) {
                    Log.d("MainActivity", "Location obtained: Lat=" + location.getLatitude() + ", Lng=" + location.getLongitude());

                    // Simplified JavaScript to only inject latitude and longitude
                    String injectedJs = String.format(
                        "window.navigator.geolocation = {" +
                        "  getCurrentPosition: function(success, error) {" +
                        "      success({" +
                        "          coords: {" +
                        "              latitude: %f," +
                        "              longitude: %f" +
                        "          }" +
                        "      });" +
                        "  }" +
                        "};",
                        location.getLatitude(),
                        location.getLongitude()
                    );

                    WebView webView = bridge.getWebView();
                    if (webView != null) {
                        webView.post(() -> webView.evaluateJavascript(injectedJs, null));
                    } else {
                        Log.e("MainActivity", "WebView is null, cannot inject JavaScript.");
                    }
                } else {
                    Log.w("MainActivity", "Last known location is null.");
                    injectGeolocationError("Could not retrieve location. Device location might be off.");
                }
            })
            .addOnFailureListener(this, e -> {
                Log.e("MainActivity", "Error getting location", e);
                injectGeolocationError("Error getting location: " + e.getMessage());
            });
    }

    private void injectGeolocationError(String errorMessage) {
        String injectedErrorJs = String.format(
            "window.navigator.geolocation = {" +
            "  getCurrentPosition: function(success, error) {" +
            "      if (error) { error({ code: 2, message: '%s' }); }" +
            "  }" +
            "};",
            errorMessage.replace("'", "\\'")
        );

        WebView webView = bridge.getWebView();
        if (webView != null) {
            webView.post(() -> webView.evaluateJavascript(injectedErrorJs, null));
        } else {
            Log.e("MainActivity", "WebView is null, cannot inject error.");
        }
    }
}