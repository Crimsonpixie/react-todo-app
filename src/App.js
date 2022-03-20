import React, { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
//list todos
//toggle todos
//add todos
//update todos
const GET_TODOS = gql`
	query getTodos {
		todos {
			done
			id
			text
		}
	}
`;
const TOGGLE_TODOS = gql`
	mutation toggleTodo($id: uuid!, $done: Boolean!) {
		update_todos(where: { id: { _eq: $id } }, _set: { done: $done }) {
			returning {
				done
				id
				text
			}
		}
	}
`;
const ADD_TODOS = gql`
	mutation addTodo($text: String!) {
		insert_todos(objects: { text: $text }) {
			returning {
				done
				id
				text
			}
		}
	}
`;
const DELETE_TODOS = gql`
	mutation deleteTodo($id: uuid!) {
		delete_todos(where: { id: { _eq: $id } }) {
			returning {
				done
				id
				text
			}
		}
	}
`;
function App() {
	const [todoText, setTodoText] = useState("");
	const { data, loading, error } = useQuery(GET_TODOS, {
		onCompleted: () => setTodoText(""),
	});
	const [toggleTodo] = useMutation(TOGGLE_TODOS);
	const [addTodo] = useMutation(ADD_TODOS);
	const [deleteTodo] = useMutation(DELETE_TODOS);

	async function handleSubmit(event) {
		event.preventDefault();
		if (!todoText.trim()) return;
		const data = await addTodo({
			variables: { text: todoText },
			refetchQueries: [{ query: GET_TODOS }],
		});
		// setTodoText("");
		console.log("added todo", data);
	}

	async function handleToggleTodo(id, done) {
		const data = await toggleTodo({ variables: { id, done: !done } });
		console.log("toggled todo", data);
	}
	async function handleDeleteTodo(id) {
		const isConfirmed = window.confirm(
			"Are you sure you want to delete this todo?"
		);
		if (isConfirmed) {
			const data = await deleteTodo({ variables: { id },
			  update:cache=>{ 
				const prevTodos=cache.readQuery({query:GET_TODOS});
				const newTodos=prevTodos.todos.filter(todo=>todo.id!==id);  
				cache.writeQuery({query:GET_TODOS,data:{todos:newTodos}});
			  }
			});
			console.log('deleted todo',data);
		}
	}

	if (loading) {
		return <div>Loading...</div>;
	}

	if (error) {
		return <div>Error in getting the data</div>;
	}
	return (
		<div className="h-100 code flex flex-column items-center bg-purple white pa3 fl-1 ">
			<h1 className="f2-l">
				GraphQL Checklist{" "}
				<span role="img" aria-label="Checkmark">
					✅
				</span>
			</h1>
			<form className="mb3" onSubmit={handleSubmit}>
				<input
					onChange={(event) => setTodoText(event.target.value)}
					className="pa2 f4 ba bw1 b--black b--dashed "
					type="text"
					placeholder="Write your todo"
					value={todoText}
				/>
				<button className="pa2 f4 bg-green" type="submit">
					Create
				</button>
			</form>
			<div className="flex items-center flex-column justify-center">
				{data.todos.map(({ id, text, done }) => (
					<p onDoubleClick={() => handleToggleTodo(id, done)} key={id}>
						<span className={`pointer list pa1 f3 ${done && "strike"}`}>
							{text}
						</span>
						<button
							className="bg-transparent bn f4"
							onClick={() => handleDeleteTodo(id)}
						>
							<span className="red">&times;</span>
						</button>
					</p>
				))}
			</div>
		</div>
	);
}

export default App;
