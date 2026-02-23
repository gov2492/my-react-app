import { useState, useEffect, useRef } from 'react';

type LogType = 'log' | 'info' | 'warn' | 'error';

interface LogMessage {
    id: string;
    type: LogType;
    message: string;
    timestamp: Date;
}

export function GlobalConsole() {
    const [logs, setLogs] = useState<LogMessage[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Override console methods
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
        };

        const interceptLog = (type: LogType, args: any[]) => {
            // Call the original method
            originalConsole[type](...args);

            // Format message
            const message = args
                .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)))
                .join(' ');

            // Add to our state
            setLogs((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36).substring(2, 9),
                    type,
                    message,
                    timestamp: new Date(),
                },
            ].slice(-100)); // Keep only last 100 logs
        };

        console.log = (...args) => interceptLog('log', args);
        console.info = (...args) => interceptLog('info', args);
        console.warn = (...args) => interceptLog('warn', args);
        console.error = (...args) => interceptLog('error', args);

        return () => {
            // Restore original console on unmount
            console.log = originalConsole.log;
            console.info = originalConsole.info;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
        };
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom when new logs arrive (if visible)
        if (isVisible && logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isVisible]);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: '#0a0f1a',
                    color: '#D4AF37',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    borderRadius: '50%',
                    width: '50px',
                    height: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    padding: 0
                }}
                title="Open Global Console"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 17 10 11 4 5"></polyline>
                    <line x1="12" y1="19" x2="20" y2="19"></line>
                </svg>
            </button>
        );
    }

    const getColorForType = (type: LogType) => {
        switch (type) {
            case 'error': return '#ef4444';
            case 'warn': return '#f59e0b';
            case 'info': return '#3b82f6';
            default: return '#e2e8f0';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '400px',
            height: '300px',
            background: '#0a0f1a',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 10000,
            fontFamily: 'monospace',
            overflow: 'hidden'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#1a202c',
                padding: '8px 16px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <strong style={{ color: '#D4AF37', fontSize: '0.9rem' }}>Global Console ({logs.length})</strong>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setLogs([])}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {logs.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', marginTop: '20px' }}>No logs yet...</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} style={{
                            fontSize: '0.8rem',
                            color: getColorForType(log.type),
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            paddingBottom: '4px',
                            wordBreak: 'break-all'
                        }}>
                            <span style={{ opacity: 0.5, marginRight: '8px' }}>
                                {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span style={{ fontWeight: log.type === 'error' ? 'bold' : 'normal' }}>
                                {log.message}
                            </span>
                        </div>
                    ))
                )}
                <div ref={logsEndRef} />
            </div>
        </div>
    );
}
