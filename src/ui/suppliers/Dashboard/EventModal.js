import React, {Component} from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Upload from '../../components/Forms/Upload';
import axios from 'axios';
import socketIOClient from 'socket.io-client';
import Loader from '../../globalComponent/Loader';
import {rootUrl} from '../../../configs/config';
import './EventForm.scss';
import Hoc from '../../globalComponent/Hoc';

class EventModal extends Component {
    state = {
        title: '',
        category: '',
        place: '',
        description: '',
        date: new Date(),
        eventVideo: '',
        youtubeVideoLink: '',
        previewImages: '',
        imageSizeError: false,
        maxReservation: '',
        otherInfos: '',
        mapLink: '',
        images: null,
        isTyping: false,
        formValid: false,
        titleValid: false,
        categoryValid: false,
        maxReservationValid: false,
        placeValid: false,
        descriptionValid: false,
        imageValid: false,
        loading: false,
        error: '',
        categories: [],
        validated: false,
        validating: false,
        deleting: false,
        tags: ''
    }

    handleInputChange = (e) => {
        e.preventDefault();
        const name = e.target.name;
        let value = e.target.value;
        if(name === "youtubeVideoLink") {
            let newValue = "https://www.youtube.com/embed/"+value.split("=")[1]
            if(newValue.includes("&")) {
                newValue = newValue.split("&")[0]
            }
            value = newValue;
        }
        this.setState({ [name]: value, error: '' },
            () => { this.validateField(name, value) });
    }

    validateField = (fieldName, value) => {
        let { titleValid, descriptionValid, placeValid, imageValid, categoryValid, maxReservationValid } = this.state;

        switch (fieldName) {
            case 'title':
                titleValid = value.length > 0;
                break;
            case 'description':
                descriptionValid = value.length > 0;
                break;
            case 'place':
                placeValid = value.length > 0;
                break;
            case 'category':
                categoryValid = value.length > 0;
                break;
            case 'images':
                imageValid = value;
                break;
            case 'maxReservation':
                maxReservationValid = value.length > 0;
                break;
            default:
                break;
        }
        this.setState({
            titleValid: titleValid,
            descriptionValid: descriptionValid,
            placeValid: placeValid,
            imageValid: imageValid,
            categoryValid: categoryValid,
            maxReservationValid: maxReservationValid
        }, this.validateForm);
    }

    validateForm = () => {
        this.setState({
            formValid:
                this.state.titleValid &&
                this.state.placeValid &&
                this.state.descriptionValid &&
                this.state.imageValid &&
                this.state.categoryValid
        });
    }

    handleSubmit = (e) => {
        e.preventDefault();
        if (this.state.formValid) {
            const formData = new FormData();
            const { title, description, place, category, eventVideo, otherInfos, date, images, youtubeVideoLink, tags, mapLink, maxReservation } = this.state;
            formData.append('title', title);
            formData.append('category', category);
            formData.append('place', place);
            formData.append('youtubeVideoLink', youtubeVideoLink);
            formData.append('description', description);
            formData.append('otherInfos', otherInfos);
            formData.append('date', date);
            formData.append('maxReservation', maxReservation);
            formData.append('tags', tags);
            formData.append('mapLink', mapLink);
            formData.append('user', JSON.stringify(this.props.user));
            if(images) {
                Array.from(images).forEach(file => {
                    formData.append('images', file);
                });
            }
            if(eventVideo !== "") {
                formData.append('eventVideo', eventVideo);
            }
            const config = {
                headers: {
                    'content-type': 'multipart/form-data'
                }
            };
            // Add event
            this.setState({ loading: true });
            if (this.props.isEditing) {
                // Update event
                try {
                    axios.patch('/api/event/' + this.props.event._id, formData, config)
                        .then(res => {
                            this.setState({
                                loading: false,
                            });
                            this.props.closeModal();
                            this.props.addNotification("success", "Modification!", "Modification éffectuée avec succès");
                        })
                        .catch(err => {
                            this.setState({ error: "Une érreur s'est produite, veuillez reéssayer.", loading: false });
                        })
                } catch (error) {
                    this.setState({ error: "Erreur de connexion. Veuillez reéssayer", loading: false });
                }
            } else {
                // Create new event
                try {
                    axios.post('/api/event/new', formData, config)
                        .then(res => {
                            this.setState({ 
                                loading: false, 
                                error: '',
                                title: '',
                                place: '',
                                category: '',
                                otherInfos: '',
                                maxReservation: '',
                                description: '',
                                mapLink: '',
                                eventVideo: '',
                                images: null,
                                previewImages: null
                             });
                            // For admin when he creates event
                            if (this.props.refreshEventList) {
                                this.props.refreshEventList();
                            }
                            this.props.addNotification("success", "Actualité!", "Actualité crée avec succès. En attente de validation");
                            this.props.closeModal();
                        })
                        .catch(err => {
                            console.log({err});
                            this.setState({ error: "Une érreur s'est produite. Veuillez reéssayer.", loading: false });
                        })
                } catch (error) {
                    this.setState({ error: "Erreur de connexion. Veuillez reéssayer", loading: false });
                }
            }
        } else {
            this.setState({ error: "Veuillez remplir tous les champs", isTyping: true });
        }
    }

    // preview image
    preview = (e) => {
        e.preventDefault();
        let imageValid = true;
        this.setState({ imageSizeError: false, previewImages: [], images: null })
        Array.from(e.target.files).forEach(file => {
            if ((file.size) / 1024 > 1024) {
                imageValid = false;
                this.setState({ imageSizeError: 'La taille d\'une image ne doit pas dépasser 1Mo.', imageValid: false })
            }
        });
        if (imageValid) {
            let images = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            this.setState({ previewImages: images, images: e.target.files, imageValid: true }, 
                () => { this.validateField("images", true)});
        }
    }

    // preview video
    setFile = (name, file) => {
        this.setState({
            [name]: file,
            error: ''
        }, this.validateForm);
    }

    pickDate = (date) => {
        this.setState({ date: date })
    }

    componentDidMount() {
        //Charge categories on form
        this.initCategories();
    }

    componentDidUpdate(prevProps) {
        if(prevProps.event !== this.props.event) {
            const { isEditing, loadingEv, event } = this.props;
            if (isEditing && !loadingEv) {
                let images = event.images.map(image => rootUrl + '/' + image);
                this.setState({
                    title: event.title,
                    category: event.category,
                    place: event.place,
                    description: event.description,
                    date: new Date(event.date),
                    maxReservation: event.maxReservation,
                    eventVideo: event.video&&event.video.length ? rootUrl + "/" + event.video : null,
                    previewImages: images,
                    otherInfos: event.otherInfos ? event.otherInfos : null,
                    validated: event.validated,
                    youtubeVideoLink: event.youtubeVideoLink,
                    tags: event.tags,
                    mapLink: event.mapLink,
                    titleValid: true,
                    maxReservationValid: true,
                    descriptionValid: true,
                    placeValid: true,
                    imageValid: true,
                    categoryValid: true,
                    formValid: true
                })
            }
        }
    }

    // Fetch categories on the server and update if there is a new one
    fetchCategories = () => {
        let categories = JSON.parse(localStorage.getItem("categories"));
        axios.get("/api/category/all")
        .then(res => {
            if(JSON.stringify(categories) !== JSON.stringify(res.data.categories)) {
                this.setState({ categories: res.data.categories })
            }
        })
        .catch(err => {
            this.setState({ error: "Erreur de chargement des catégories. Veuillez reéssayer." })
        })
    }

    initCategories = () => {
        let categories = JSON.parse(localStorage.getItem("categories"));
        if (categories && categories.length) {
            this.setState({ categories: categories });
            // Verify is there is a new category
            this.fetchCategories();
        } else {
            try {
                this.fetchCategories();
            } catch (error) {
                this.setState({ error: "Erreur de chargement des catégories. Veuillez reéssayer." })
            }
        }
    }

    validateEvent = (event) => {
        this.setState({ validating: true, event: event })
        axios.patch('/api/event/validate/' + event._id)
            .then(res => {
                let events = this.props.events.map(event => {
                    let newEvent = { ...event };
                    if (event._id === this.props.event._id) {
                        newEvent.validated = true;
                    }
                    return newEvent;
                })
                this.props.refreshList(events, "events");
                this.props.closeModal();
                this.setState({
                    validating: false,
                    'error': ''
                })
                // Send a notification
                const not = {
                    to: "all",
                    title: event.title,
                    image: rootUrl + '/' + event.image,
                    link: '/annonce/event/' + event._id,
                    name: "Le Fournisseur",
                    visited: false,
                    projectId: event._id,
                    date: new Date()
                }
                // First save befor send notification
                axios.patch('/api/user/recommand/to/all', { rec: not })
                    .then(res => {
                        const socket = socketIOClient(rootUrl);
                        socket.emit("new anounce notification", not);
                    })
                    .catch(err => {
                        this.setState({ recError: 'Une érreur s\'est produite. Veuillez recharger la page.' })
                    })
                // Send Email to Supplier
            })
            .catch(err => {
                this.setState({
                    validating: false,
                    'error': 'Erreur survenue, veuillez actualiser'
                })
            })
    }

    deleteEvent = (event) => {
        this.setState({ deleting: true, event: event })
        axios.delete('/api/event/' + event._id)
            .then(res => {
                let events = this.props.events.filter(event => {
                    return JSON.stringify(event) !== JSON.stringify(this.props.event)
                })
                this.props.refreshList(events, "events");
                this.props.closeModal();
                this.setState({
                    deleting: false,
                    'error': ''
                })
            })
            .catch(err => {
                this.setState({
                    deleting: false,
                    error: err
                })
            })
    }

    render() {
        const { eventVideo, title, description, place, otherInfos, date, youtubeVideoLink,
            category, imageValid, titleValid, descriptionValid, placeValid, categoryValid,
            error, loading, isTyping, categories, validating, deleting, tags, mapLink,
            maxReservation, maxReservationValid } = this.state;
        const { show, closeModal, loadingEv, isEditing, event} = this.props;
        return (
            <Modal show={show} onHide={() => closeModal()} size="lg" >
                <Modal.Header closeButton>
                    <Modal.Title>Ajouter une nouvelle Actualité</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="create-form">
                        <div className="container">
                            <div className="row">
                                <div className="col-sm-12 pl-4 pr-4 mt-4 mb-3">
                                    {
                                        loadingEv ? <div className="d-flex justify-content-center"><Loader /></div> :
                                        <Hoc>
                                          {error && error.length ? <div className="alert alert-danger" style={{ fontSize: "1.3rem" }}>{error}</div> : null}
                                            <div className="form-group">
                                                <label for="name">Titre</label>
                                                    <input type="text" className={isTyping && !titleValid ? "form-control is-invalid" : "form-control"} value={title} onChange={(e) => this.handleInputChange(e)} name="title" placeholder="Titre de l'évènement" required />
                                                    {isTyping && !titleValid ? <div className="invalid-feedback">Invalide</div> : null}
                                            </div>
                                            <div className="form-group">
                                                <label for="category">Catégorie</label>
                                                <select id="category" name="category" value={category} onChange={(e) => this.handleInputChange(e)} className={isTyping && !categoryValid ? "form-control is-invalid" : "form-control"} >
                                                    <option>Choisir...</option>
                                                    {
                                                        categories && categories.length ?
                                                            categories.map(category => (
                                                                <option key={category._id}>{category.name}</option>
                                                            )) : <option>Loading...</option>
                                                    }
                                                </select>
                                                    {isTyping && !categoryValid ? <div className="invalid-feedback">Sélectionnez une catégorie</div> : null}
                                            </div>
                                            <div className="form-group">
                                                <label for="name">Description</label>
                                                <textarea type="text" value={description} className={isTyping && !descriptionValid ? "form-control is-invalid" : "form-control"} onChange={(e) => this.handleInputChange(e)} name="description" rows={2} placeholder="Resumé"></textarea>
                                                {isTyping && !descriptionValid ? <div className="invalid-feedback">Invalide</div> : null}
                                            </div>
                                            <div className="row justify-content-between">
                                                <div className="col-sm-12 col-md-7 col-lg-7">
                                                    <div className="form-group">
                                                        <label for="name">Lieu</label>
                                                            <input type="text" value={place} onChange={(e) => this.handleInputChange(e)} className={isTyping && !placeValid ? "form-control is-invalid" : "form-control"} name="place" placeholder="Lieu de l'évènement" required />
                                                        {isTyping && !placeValid ? <div className="invalid-feedback">Invalide</div> : null}
                                                    </div>
                                                </div>
                                                <div className="col-sm-12 col-md-5 col-lg-5">
                                                    <div className="form-group mt-2">
                                                        <label for="name">Date et Heure de l'évènement</label><br />
                                                        <DatePicker showTimeSelect dateFormat="Pp" className="form-control" selected={date} onChange={date => this.pickDate(date)} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="form-group">
                                                <label for="name">Nombre Maximal des Réservations</label>
                                                <input type="number" value={maxReservation} onChange={(e) => this.handleInputChange(e)} className={isTyping && !maxReservationValid ? "form-control is-invalid" : "form-control"} name="maxReservation" placeholder="Nombre Max de réservations" required />
                                                {isTyping && !maxReservationValid ? <div className="invalid-feedback">Invalide</div> : null}
                                            </div>
                                            <div className="form-group">
                                                <label for="tags">Lien Google Map</label>
                                                <input type="text" value={mapLink} onChange={(e) => this.handleInputChange(e)} className="form-control" name="mapLink" placeholder="Lien Google Map" />
                                            </div>
                                            <div className="form-group">
                                                <label for="tags">Tags <strong>(Séparer par des virgules ",")</strong></label>
                                                <input type="text" value={tags} onChange={(e) => this.handleInputChange(e)} className= "form-control" name="tags" placeholder="Tags: Exple fete, concert, boutique" />
                                            </div>
                                            <div className="form-group">
                                                <label for="name">Autres informations</label>
                                                <textarea type="text" className="form-control" value={otherInfos} onChange={(e) => this.handleInputChange(e)} name="otherInfos" rows={3} placeholder="Autres informations"></textarea>
                                            </div>
                                            <div className="row align-items-start py-3">
                                                <div className="col-sm-12 col-md-6 col-lg-6">
                                                    <label for="name">Importer des images</label><br />
                                                    <div className="custom-file">
                                                        <input onChange={(e) => this.preview(e)} type="file" className="custom-file-input" accept="image/*" id="customFile" multiple />
                                                        <label className="custom-file-label" for="customFile">Choisir les images</label>
                                                    </div>
                                                    {isTyping && !imageValid ? <p className="alert alert-danger">Image Requise</p> : null}
                                                    <div className="row justify-content-center mt-3">
                                                        {this.state.previewImages ?
                                                            this.state.previewImages.map((image, id) => (
                                                                <div key={id} className="col-sm-6 mt-2">
                                                                    <img src={image} className="img-fluid" alt="" />
                                                                </div>
                                                            )) : null
                                                        }
                                                        {this.state.imageSizeError ? <div className="container"><div className="alert alert-danger">{this.state.imageSizeError}</div></div>:null}
                                                    </div>
                                                </div>
                                                <div className="col-sm-12 col-md-6 col-lg-6">
                                                    <label for="name">Importer une vidéo</label><br />
                                                    <Upload type="video" oldUrl={eventVideo} setFile={(name, file) => this.setFile(name, file)} name="eventVideo" label={"Importer depuis votre ordinateur"} />
                                                    <span>Ou bien insérez le lien youtube.</span>
                                                    <input type="text" value={youtubeVideoLink} onChange={(e) => this.handleInputChange(e)} className="form-control" name="youtubeVideoLink" placeholder="Lien youtube" />
                                                    {
                                                        youtubeVideoLink&&youtubeVideoLink.length ?
                                                        <iframe width="100%" title="video"
                                                            src={youtubeVideoLink}>
                                                        </iframe>:null
                                                    }
                                                </div>
                                            </div>
                                            {
                                                !isEditing ? 
                                                <div className="d-flex justify-content-end">
                                                    <button disabled={loading} type="submit" onClick={(e) => this.handleSubmit(e)} className="button fourth mt-4 mb-5">{loading ? <Loader color="white" /> : "Ajouter l'Evenement"}</button>
                                                </div>:
                                                <div className="d-flex justify-content-end">
                                                    <button disabled={loading} type="submit" onClick={(e) => this.handleSubmit(e)} className="button fourth mt-4 mb-5">{loading ? <Loader color="white" /> : "Enregistrer la modification"}</button>
                                                </div>
                                            }
                                        </Hoc>
                                    }
                                </div>
                            </div>
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    {
                        isEditing ? 
                        <Hoc>
                            {!this.state.validated ? <Button disabled={validating} variant="dark" className="mr-3" onClick={() => this.validateEvent(event)}>{validating ? <Loader color="white" /> : "Valider l'actualité"}</Button>: null}
                            <Button variant="danger" disabled={deleting} className="mr-3" onClick={() => this.deleteEvent(event)}>{deleting ? <Loader color="white" /> : "Supprimer"}</Button>
                        </Hoc>:null
                    }
                    <Button variant="default" onClick={() => closeModal()}>Fermer</Button>
                </Modal.Footer>
            </Modal>
        )
    }
}

export default EventModal;