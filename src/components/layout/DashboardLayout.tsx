import React from 'react';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex bg-background text-foreground">
            {/* Sidebar */}
            <aside className="w-64 border-r border-border glass hidden md:flex flex-col p-6 fixed h-screen">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="font-bold text-white text-xl">I</span>
                    </div>
                    <h1 className="text-xl font-bold tracking-tight outfit">Intervu-AI</h1>
                </div>

                <nav className="flex-1 space-y-2">
                    {['Dashboard', 'Architect', 'Interviews', 'Candidates', 'Settings'].map((item) => (
                        <a
                            key={item}
                            href="#"
                            className={`flex items-center px-4 py-3 rounded-xl transition-all ${item === 'Architect'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                                }`}
                        >
                            {item}
                        </a>
                    ))}
                </nav>

                <div className="pt-6 border-t border-border mt-auto">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-secondary border border-border" />
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate">Dexter</p>
                            <p className="text-xs text-muted-foreground truncate">Hiring Manager</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 p-6 md:p-10 lg:p-16">
                <header className="flex justify-between items-center mb-12">
                    <div>
                        <h2 className="text-3xl font-bold outfit">Interview Architect</h2>
                        <p className="text-muted-foreground mt-1">Transform hiring intent into structured flows.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="px-6 py-2.5 rounded-xl border border-border hover:bg-white/5 transition-all text-sm font-medium">
                            View All
                        </button>
                        <button className="px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm font-medium">
                            History
                        </button>
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
};
