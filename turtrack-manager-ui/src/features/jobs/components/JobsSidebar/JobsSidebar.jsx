import React from 'react';
import { Play, GitBranch, GitPullRequest, Settings } from 'lucide-react';

const JobsSidebar = () => {
    return (
        <div className="w-64 bg-gray-900 text-white h-screen p-4">
            <div className="mb-8">
                <div className="space-y-2">
                    <button className="w-full text-left py-2 px-4 rounded hover:bg-gray-800 flex items-center">
                        <Play className="mr-2" size={18} />
                        Actions
                    </button>
                    <button className="w-full text-left py-2 px-4 rounded hover:bg-gray-800 flex items-center">
                        <GitBranch className="mr-2" size={18} />
                        Branches
                    </button>
                    <button className="w-full text-left py-2 px-4 rounded hover:bg-gray-800 flex items-center">
                        <GitPullRequest className="mr-2" size={18} />
                        Pull requests
                    </button>
                    <button className="w-full text-left py-2 px-4 rounded hover:bg-gray-800 flex items-center">
                        <Settings className="mr-2" size={18} />
                        Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobsSidebar;