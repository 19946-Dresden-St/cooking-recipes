import React from 'react'
import {useLoaderData} from "react-router-dom";
import foodImg from '../assets/cookies.jpeg'
import { BsFillStopwatchFill } from "react-icons/bs";
import { FaHeart } from "react-icons/fa6";


export default function RecipeItems() {
    const allRecipes = useLoaderData()
    console.log(allRecipes)
    return (
        <>
            <div className="card-container">
                {
                    allRecipes?.map((item, index) => {
                        return (
                            <div key={index} className="card">
                                <img src={foodImg} alt="cookies picture" width="120px" height="100px"></img>
                                <div className="card-body">
                                    <div className="title">{item.title}</div>
                                    <div className="icons">
                                        <div className="timer"><BsFillStopwatchFill />{item.time}</div>
                                        <FaHeart />
                                    </div>
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
}
