import React from 'react'
import usePageTitle from "../hooks/usePageTitle.js";
import foodRecipe from '../assets/cookies.jpeg'
import heroImg from "../assets/heroSection.jpg";
import RecipeItems from "../components/RecipeItems.jsx";
import {NavLink, useNavigate} from "react-router-dom";
import Modal from "../components/Modal.jsx";
import InputForm from "../components/InputForm.jsx";

export default function Home() {

    usePageTitle("Qu'est-ce qu'on mange ? | Accueil");

    const navigate = useNavigate()
    const [isOpen, setIsOpen] = React.useState(false)

    const addRecipe = () => {
        let token = localStorage.getItem("token")
        if(token) {
            navigate("/addRecipe")
        } else {
            setIsOpen(true)
        }
    }

    return (
        <>
            <section className="relative h-screen w-screen overflow-hidden">
                <img
                    src={heroImg}
                    alt="Hero food"
                    className="absolute inset-0 h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-black/35" />

                <div className="relative z-10 flex h-full items-center">
                    <div className="w-full px-6 md:px-12">
                        <div className="max-w-xl">
                            <h1 className="text-white">
                                Repas de merde !
                            </h1>

                            <h2 className="mt-4 text-lg md:text-2xl font-semibold text-white/90">
                                Des recettes simples, rapides, et (vraiment) bonnes.
                            </h2>

                            <a
                                href="#recipesList"
                                className="btn-primary inline-block mt-8"
                            >
                                Découvrir les recettes
                            </a>
                        </div>
                    </div>
                </div>
            </section>
            <section className="">
                <div className="left">
                    <h1 className="">Food Recipe</h1>
                    <h5 className="text-red-400">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Ad commodi cumque dolores exercitationem fuga harum iusto laudantium magnam minima modi natus odit pariatur, quibusdam sunt tenetur voluptate, voluptatum. Est, provident.</h5>
                    <button onClick={addRecipe} >Share your recipe</button>
                </div>
                <div className="right">
                    <img src={foodRecipe} width="320px" height="300px" alt="cookies picture"></img>
                </div>
            </section>

            {
                isOpen && (
                    <Modal onClose={() => setIsOpen(false)}>
                        <InputForm setIsOpen={()=>setIsOpen(false)} />
                    </Modal>
                )
            }

            <div id="recipesList" className="recipe">
                <RecipeItems />
            </div>
        </>
    )
}
