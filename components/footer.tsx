export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-50 px-6 py-6 text-center">
      <p className="mx-auto max-w-3xl text-xs text-neutral-500">
        OITA no certifica ni aprueba sistemas. Evalúa la transparencia algorítmica con base en
        información pública disponible.
      </p>
      <p className="mt-2 text-xs text-neutral-400">
        Hecho por{" "}
        <a
          href="https://www.linkedin.com/in/oscarenpalomino14"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-neutral-600 hover:underline"
        >
          Ing. Oscar Palomino Medina
        </a>
      </p>
    </footer>
  );
}
