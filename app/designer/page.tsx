"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import EquipmentSidebar from "./EquipmentSidebar";
import DesignerToolbar from "./DesignerToolbar";
import PropertiesPanel from "./PropertiesPanel";

const DesignerCanvas = dynamic(() => import("./DesignerCanvas"), { ssr: false });

export default function DesignerPage() {
  const [activeView, setActiveView] = useState("Grid");
  const [activeTab, setActiveTab] = useState("Properties");

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <EquipmentSidebar />

      <div className="flex-1 flex flex-col">
        <DesignerToolbar activeView={activeView} onViewChange={setActiveView} />
        <DesignerCanvas />
      </div>

      <PropertiesPanel activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
