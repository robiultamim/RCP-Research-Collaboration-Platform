package com.rcp.socket;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Component
public class ChatServer {

    private static final int SOCKET_PORT = 9090;
    private static final int THREAD_POOL_SIZE = 20;

    public static void main(String[] args) {
        startServer();
    }

    @EventListener(ApplicationReadyEvent.class)
    public void initOnSpringStart() {
        new Thread(() -> startServer()).start();
    }

    public static void startServer() {
        ExecutorService threadPool = Executors.newFixedThreadPool(THREAD_POOL_SIZE);
        try (ServerSocket serverSocket = new ServerSocket(SOCKET_PORT)) {
            System.out.println("=================================================");
            System.out.println("🚀 JAVA MULTITHREADED SOCKET CHAT SERVER STARTED!");
            System.out.println("   Listening on Port: " + SOCKET_PORT);
            System.out.println("   ThreadPool Executor Capacity: " + THREAD_POOL_SIZE + " concurrent threads");
            System.out.println("=================================================");

            while (true) {
                Socket clientSocket = serverSocket.accept();
                System.out.println("[Socket Server] New client connected: " + clientSocket.getRemoteSocketAddress());
                ClientHandler handler = new ClientHandler(clientSocket);
                threadPool.execute(handler); // Multithreaded execution per client!
            }
        } catch (IOException e) {
            System.err.println("Socket Server error: " + e.getMessage());
        }
    }
}
