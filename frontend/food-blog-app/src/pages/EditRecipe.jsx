import React, {useEffect} from 'react'
import axios from "axios";
import {useNavigate, useParams} from "react-router-dom";
import {API_BASE_URL} from "../apiBase.js";
import usePageTitle from "../hooks/usePageTitle.js";

export default function EditRecipe() {

    usePageTitle("Qu'est-ce qu'on mange ? | Modifier la recette");


    const [recipeData, setRecipeData] = React.useState({})
    const navigate = useNavigate()
    const {id} = useParams()

    useEffect(() => {
        const getData = async () => {
            await axios.get(`${API_BASE_URL}/recipe/${id}`)
                .then(response => {
                    let res = response.data
                    setRecipeData({
                        title: res.title,
                        ingredients: res.ingredients.join(','),
                        instructions: res.instructions,
                        time: res.time
                    })
                })
        }
        getData()
    }, [])

    const onHandleChange = (e) => {
        let val = (e.target.name === "ingredients") ? e.target.value.split(',') : (e.target.name === "file") ? e.target.files[0] : e.target.value
        setRecipeData(pre => ({...pre, [e.target.name]: val}))
    }

    const onHandleSubmit = async (e) => {
        e.preventDefault()
        console.log(recipeData)
        await axios.put(`${API_BASE_URL}/recipe/${id}`, recipeData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'authorization': 'bearer ' + localStorage.getItem('token')

            }
        })
            .then(() => navigate('/') )
    }

    return (
        <>
            <div className='container'>
                <form className='form' onSubmit={onHandleSubmit}>
                    <div className='form-control'>
                        <label>Title</label>
                        <input type="text"
                               className='input'
                               name="title"
                               onChange={onHandleChange}
                               value={recipeData.title}
                        ></input>
                    </div>
                    <div className='form-control'>
                        <label>Time</label>
                        <input type="text"
                               className='input'
                               name="time"
                               onChange={onHandleChange}
                               value={recipeData.time}
                        ></input>
                    </div>
                    <div className='form-control'>
                        <label>Ingredients</label>
                        <textarea type="text"
                                  className='input-textarea'
                                  name="ingredients"
                                  rows="5"
                                  onChange={onHandleChange}
                                  value={recipeData.ingredients}
                        ></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Instructions</label>
                        <textarea type="text"
                                  className='input-textarea'
                                  name="instructions"
                                  rows="5"
                                  onChange={onHandleChange}
                                  value={recipeData.instructions}
                        ></textarea>
                    </div>
                    <div className='form-control'>
                        <label>Recipe Image</label>
                        <input type="file"
                               className='input'
                               name="file"
                               onChange={onHandleChange}
                        ></input>
                    </div>
                    <button type="submit">Edit Recipe</button>
                </form>
            </div>
        </>
    )
}
