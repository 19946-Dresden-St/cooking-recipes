import React, {useState} from 'react'
import Modal from "./Modal.jsx";
import InputForm from "./InputForm.jsx";
import {NavLink} from "react-router-dom";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const checkLogin = () => {
        setIsOpen(true);
    }
    return (
        <>
            <header>
                <h2>Food Blog</h2>
                <ul>
                    <li><NavLink to="/">Home</NavLink></li>
                    <li><NavLink to="/myRecipe">My Recipes</NavLink></li>
                    <li><NavLink to="/favRecipe">Favourites</NavLink></li>
                    <li onClick={checkLogin}><p className="login">Login</p></li>
                </ul>
            </header>
            {
                isOpen && (
                    <Modal onClose={() => setIsOpen(false)}>
                        <InputForm setIsOpen={()=>setIsOpen(false)} />
                    </Modal>
                )
            }
        </>
    )
}
