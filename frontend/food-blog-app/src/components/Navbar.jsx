import React, {useEffect, useState} from 'react'
import Modal from "./Modal.jsx";
import InputForm from "./InputForm.jsx";
import {NavLink} from "react-router-dom";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    let token = localStorage.getItem("token");
    const [isLogin, setIsLogin] = useState(token ? true : false);

    useEffect(() => {
        setIsLogin(token ? false : true);
    }, [token])

    const checkLogin = () => {
        if(token) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            setIsLogin(true)
        } else {
            setIsOpen(true);
        }
    }

    return (
        <>
            <header>
                <h2>Food Blog</h2>
                <ul>
                    <li><NavLink to="/">Home</NavLink></li>
                    <li><NavLink onClick={() => isLogin && setIsOpen(true)} to={ !isLogin ? "/myRecipe" : "/"}>My Recipes</NavLink></li>
                    <li><NavLink onClick={() => isLogin && setIsOpen(true)} to={ !isLogin ? "/favRecipe" : "/"}>Favourites</NavLink></li>
                    <li onClick={checkLogin}><p className="login">{ (isLogin) ? "Login" : "Logout" }</p></li>
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
