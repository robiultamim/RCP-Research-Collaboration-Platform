package com.rcp.socket;

import java.io.*;
import java.net.Socket;

public class ClientHandler implements Runnable {
    private final Socket socket;
    private BufferedReader reader;
    private PrintWriter writer;
    private Long currentProjectId = 1L;
    private String senderName = "Anonymous";

    public ClientHandler(Socket socket) {
        this.socket = socket;
        try {
            this.reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            this.writer = new PrintWriter(socket.getOutputStream(), true);
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void run() {
        try {
            ChatRoomManager.joinRoom(currentProjectId, this);
            writer.println("[SYSTEM] Connected to Java Socket Chat Server (Port 9090). Multithreaded Pool Ready.");

            String messageLine;
            while ((messageLine = reader.readLine()) != null) {
                if (messageLine.equalsIgnoreCase("QUIT")) {
                    break;
                }
                // Broadcast to room members
                ChatRoomManager.broadcast(currentProjectId, messageLine, this);
            }
        } catch (IOException e) {
            System.err.println("Client socket disconnected: " + e.getMessage());
        } finally {
            ChatRoomManager.leaveRoom(currentProjectId, this);
            try {
                socket.close();
            } catch (IOException ignored) {}
        }
    }

    public void sendMessage(String msg) {
        if (writer != null) {
            writer.println(msg);
        }
    }
}
