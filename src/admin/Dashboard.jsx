import { LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-playfair text-2xl sm:text-3xl font-semibold text-charcoal">
          Dashboard
        </h1>
        <p className="text-charcoal/60 font-inter mt-1">
          Welcome to Willow & Water Admin
        </p>
      </div>

      {/* Placeholder Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/5 p-12 text-center">
        <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <LayoutDashboard className="w-8 h-8 text-sage" />
        </div>
        <h2 className="font-playfair text-xl font-semibold text-charcoal mb-2">
          Admin Portal
        </h2>
        <p className="text-charcoal/60 font-inter max-w-md mx-auto">
          This is your admin dashboard. Features will be added here soon.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
