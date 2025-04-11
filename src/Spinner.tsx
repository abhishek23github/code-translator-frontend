const Spinner = () => {
    return (
        <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            <span className="ml-3 text-blue-600 font-medium">Converting...</span>
        </div>
    );
};

export default Spinner;
