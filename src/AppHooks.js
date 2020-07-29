import React, {useState, useEffect} from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from '@aws-amplify/ui-react'
import { createNote, deleteNote, updateNote } from './graphql/mutations'
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions'
import { listNotes } from './graphql/queries'
import update from 'react-addons-update';

const App = () => {
  const [id, setId] = useState("")
  const [note, setNote] = useState("")
  const [notes, setNotes] = useState([])
  
  useEffect(() => {
    getNotes()
    const createListener = API.graphql( graphqlOperation( onCreateNote ) )
      .subscribe({ next: res => {
          const note = res.value.data.onCreateNote          
        setNotes( pV => { return update( pV, { $push: [note] } ) } )
        setNote("")
        }})

    const deleteListener = API.graphql( graphqlOperation( onDeleteNote ) )
      .subscribe({ next: res => {
          const noteId = res.value.data.onDeleteNote.id;
          setNotes( pV => { return pV.filter( n => n.id !== noteId ) } )
        }})

    const updateListener = API.graphql( graphqlOperation( onUpdateNote ) )
      .subscribe({ next: res => { 
          const updatedNote = res.value.data.onUpdateNote
          setNotes( pV => { 
            const index = pV.findIndex( n => n.id === updatedNote.id )
            return update( pV, { [index]: { $set: updatedNote } } )
          })
      }})

      return () => {
          createListener.unsubscribe()
          deleteListener.unsubscribe()
          updateListener.unsubscribe()
      }
  }, [])
  

  const getNotes = async () => {
    const result = await API.graphql(graphqlOperation(listNotes))
    setNotes(result.data.listNotes.items)
  }

  const handleSetNote = ( { note, id } ) => {
    setNote(note)
    setId(id)
  }

  const hasExistingNote = () => {
    return id ? notes.findIndex(n => n.id === id) > -1 : false
  }

  const handleChangeNote = e => setNote(e.target.value)

  const handleDeleteNote = async noteId => {
    const input = { id: noteId }
    await API.graphql(graphqlOperation(deleteNote, { input }))
  }

  const handleAddNote = async evt => {
    evt.preventDefault()
    if (hasExistingNote())
      return handleUpdateNote()
    
    await API.graphql( graphqlOperation( createNote, { input: { note } } ) )
  }

  const handleUpdateNote = async () => {
    const input = { id, note }
    await API.graphql(graphqlOperation(updateNote, { input }))
  }

  
  return (
    <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
      <h1 className='code f2-1'> Notetaker </h1>
      <form onSubmit={handleAddNote} className='mb3'>
        <input
          type='text'
          value={note}
          className='pa2 f4'
          placeholder='Write it bitch'
          onChange={handleChangeNote}
        />
        <button className='pa2 f4' type='submit'>
          {id ? "Update" : 'Add Note'}
        </button>
      </form>
      <div className='items-left pa3'>
        {notes.map(item => (
          <div className='flex items-left' key={item.id}>
            <li
              onClick={() => handleSetNote(item)}
              className='list pa1 f3'>
              {item.note}{' '}
            </li>
            <p
              className='pa1 f7'
              onClick={() => handleDeleteNote(item.id)}
            >
              X
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default withAuthenticator(App)
