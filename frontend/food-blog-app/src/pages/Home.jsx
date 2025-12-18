import React from 'react'
import usePageTitle from "../hooks/usePageTitle.js";
import foodRecipe from '../assets/cookies.jpeg'
import RecipeItems from "../components/RecipeItems.jsx";
import {useNavigate} from "react-router-dom";
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
            <div className="bg">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#D4F6E8" fillOpacity="1" d="M0,128L30,133.3C60,139,120,149,180,133.3C240,117,300,75,360,69.3C420,64,480,96,540,128C600,160,660,192,720,192C780,192,840,160,900,160C960,160,1020,192,1080,186.7C1140,181,1200,139,1260,138.7C1320,139,1380,181,1410,202.7L1440,224L1440,320L1410,320C1380,320,1320,320,1260,320C1200,320,1140,320,1080,320C1020,320,960,320,900,320C840,320,780,320,720,320C660,320,600,320,540,320C480,320,420,320,360,320C300,320,240,320,180,320C120,320,60,320,30,320L0,320Z"></path></svg>
            </div>

            {
                isOpen && (
                    <Modal onClose={() => setIsOpen(false)}>
                        <InputForm setIsOpen={()=>setIsOpen(false)} />
                    </Modal>
                )
            }

            <div className="recipe">
                <RecipeItems />
            </div>
        </>
    )
}
