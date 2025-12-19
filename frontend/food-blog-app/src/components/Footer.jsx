export default function Footer() {
    return (
        <footer className="bg-white border-t border-zinc-200">
            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-primary text-lg font-extrabold">Repas de Merde</p>
                        <p className="mt-1 text-sm text-zinc-600">
                            “Parce qu’on a tous déjà galéré à trouver quoi manger.”
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <a className="rounded-md px-5 py-2.5 font-semibold text-primary hover:bg-secondary transition duration-600" href="/#recipesList">
                            Voir les recettes
                        </a>
                        <a className="btn-primary" href="https://ic-design.vercel.app/ ">
                            Me contacter
                        </a>
                    </div>
                </div>

                <div className="mt-8 text-xs text-zinc-500">
                    © {new Date().getFullYear()} — Made with ❤️ pour ma maman.
                </div>
            </div>
        </footer>
    );
}
