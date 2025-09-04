import React from "react";
import FeaturesDropdown from "./FeaturesDropdown";

export default function CVBuilderPanel({ onFeatureSelect }) {
  return (
    <>
      <div className="bg-gray-400 text-white font-bold p-4 rounded-t-xl text-center relative">
        CV Builder
      </div>

      <div className="flex-grow flex justify-center items-center p-6 text-gray-600 font-medium">
        This feature is currently locked and coming soon.
      </div>

      {/* Empty form section to maintain consistent layout */}
      <div className="w-full flex flex-col px-4 my-2 mb-4">
        <div className="w-full flex gap-2 items-center rounded-full px-3 py-2 border-gradient-animation bg-gradient-to-r from-orange-400 via-yellow-500 to-red-500">
          <div className="flex items-center bg-white rounded-full gap-2 pr-3">
            <input
              className="w-full flex-1 text-sm outline-none border-none px-3 py-2"
              type="text"
              placeholder="Feature locked..."
              disabled={true}
            />
            <FeaturesDropdown onFeatureSelect={onFeatureSelect} />
          </div>
        </div>
      </div>
    </>
  );
}