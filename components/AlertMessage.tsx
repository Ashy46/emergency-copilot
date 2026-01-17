interface AlertMessageProps {
  title?: string;
  message: string;
}

export default function AlertMessage({
  title = "🚨 Emergency Alert",
  message = "No message provided"
}: AlertMessageProps) {
  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none flex items-start justify-center p-6 rounded-lg">
      <div className="bg-black/35 backdrop-blur-lg border-2 border-[#646cff]/35 rounded-xl p-6 max-w-[90%] shadow-[0_8px_32px_rgba(0,0,0,0.3)] pointer-events-auto animate-fadeIn">
        <h3 className="m-0 mb-3 text-[#ff6b6b] text-[1.3rem] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
          {title}
        </h3>
        <p className="m-0 text-white leading-[1.6] text-base drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
          {message}
        </p>
      </div>
    </div>
  )
}
