import Image from "next/image";

export default function SeriesPoster({
  src,
  alt,
  sizes = "(max-width: 640px) 50vw, 256px",
  className = "",
  children,
}: {
  src: string | null;
  alt: string;
  sizes?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-500">
          {alt}
        </div>
      )}
      {children}
    </div>
  );
}