const Index = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div 
        className="w-full max-w-[1400px] bg-[hsl(var(--dashboard-container))] border border-[hsl(var(--dashboard-border))] rounded-2xl p-8"
        style={{ minHeight: '600px' }}
      >
        {/* Empty container shell - ready for dashboard sections */}
      </div>
    </div>
  );
};

export default Index;
