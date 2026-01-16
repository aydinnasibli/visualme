interface SideActionsProps {
  handleSave: () => void;
  isSaved: boolean;
  saving: boolean;
  toggleEditPanel: () => void;
}

const SideActions = ({ handleSave, isSaved, saving, toggleEditPanel }: SideActionsProps) => {
  return (
    <>
      <div className="absolute bottom-8 right-8 flex flex-col gap-3 z-30">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-10 h-10 rounded-full glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-lg tooltip ${
            isSaved ? 'text-green-400' : ''
          }`}
          title={isSaved ? 'Visualization Saved' : 'Save Visualization'}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <span className="material-symbols-outlined text-[20px]">{isSaved ? 'check_circle' : 'save'}</span>
          )}
        </button>
        <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-lg tooltip" title="Export">
          <span className="material-symbols-outlined text-[20px]">ios_share</span>
        </button>
        <button
          onClick={toggleEditPanel}
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-lg tooltip"
          title="Code View"
        >
          <span className="material-symbols-outlined text-[20px]">code</span>
        </button>
        <button className="w-10 h-10 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-500 hover:text-white hover:border-stone-500 transition-all shadow-lg tooltip" title="History">
          <span className="material-symbols-outlined text-[20px]">history</span>
        </button>
      </div>
      <div className="absolute bottom-8 left-8 flex flex-col gap-3 z-30">
        <button className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/5 hover:border-white/20 transition-all shadow-lg tooltip" title="Projects">
          <span className="material-symbols-outlined text-[20px]">folder_open</span>
        </button>
      </div>
    </>
  );
};

export default SideActions;
