package com.purepak.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.Random;

/**
 * Receives every push (see server's sendPush()) as a data-only message — no
 * top-level "notification" block — so this always runs, foreground or
 * background, and always gets to build the notification itself. That's the
 * only way a tap can carry the same "ref" the in-app bell already uses to
 * deep-link into the right screen (App.routeByRef in app.js).
 */
public class PurePakFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "PurePakFCM";
    private static final String CHANNEL_ID = "purepak_default";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        Map<String, String> data = message.getData();
        String title = data.getOrDefault("title", "PurePak");
        String body = data.getOrDefault("body", "");
        String ref = data.getOrDefault("ref", "");
        showNotification(title, body, ref);
    }

    @Override
    public void onNewToken(@NonNull String token) {
        // MainActivity fetches the current token itself on every page load
        // (FirebaseMessaging.getInstance().getToken() always returns the
        // latest one, rotated or not), so there's nothing to forward here.
        Log.i(TAG, "FCM token refreshed");
    }

    private void showNotification(String title, String body, String ref) {
        ensureChannel();

        Intent tap = new Intent(this, MainActivity.class);
        tap.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (!ref.isEmpty()) tap.putExtra(MainActivity.EXTRA_PUSH_REF, ref);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent pi = PendingIntent.getActivity(this, new Random().nextInt(), tap, flags);

        NotificationCompat.Builder n = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setContentIntent(pi)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        try {
            NotificationManagerCompat.from(this).notify((int) System.currentTimeMillis(), n.build());
        } catch (SecurityException e) {
            // POST_NOTIFICATIONS not granted — nothing to do, the in-app bell still works
            Log.w(TAG, "notification permission not granted, dropping push");
        }
    }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = getSystemService(NotificationManager.class);
        if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "PurePak updates", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Orders, deliveries and account updates");
        nm.createNotificationChannel(ch);
    }
}
